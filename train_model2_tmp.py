import os
import time
import copy
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import efficientnet_v2_s
from sklearn.metrics import classification_report, confusion_matrix

# ============================================================
# CONFIGURATION
# ============================================================

# Use existing dataset splits
DATASET_DIR = r"C:\FruitVision\working\dataset\quality_grading"
TRAIN_DIR = os.path.join(DATASET_DIR, "train")
VAL_DIR = os.path.join(DATASET_DIR, "val")
TEST_DIR = os.path.join(DATASET_DIR, "test")

# Model paths
MODEL_DIR = r"C:\FruitVision\working\models"
STAGE1_MODEL_PATH = os.path.join(MODEL_DIR, "fruit_classifier_efficientnet_v2_s.pth")
STAGE2_MODEL_PATH = os.path.join(MODEL_DIR, "quality_classifier_efficientnet_v2_s.pth")
CLASSES_JSON_PATH = os.path.join(MODEL_DIR, "quality_classes.json")
HISTORY_JSON_PATH = os.path.join(MODEL_DIR, "quality_classifier_training_history.json")

# Hyperparameters (CPU friendly)
IMAGE_SIZE = 224
BATCH_SIZE = 16  # Reduced for CPU
NUM_EPOCHS = 5   # Keep it short for practical CPU training
LEARNING_RATE = 0.001
WEIGHT_DECAY = 1e-4
NUM_WORKERS = 0  # 0 is safest on Windows without if __name__ == '__main__' wrapping

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ============================================================
# PRE-TRAINING CHECKS
# ============================================================

print("============================================================")
print("FruitVision - Stage 2: Quality Classification Training")
print("============================================================")

# 3. Print the selected device
print(f"Selected Device: {DEVICE}")

# 4. Print the Stage-1 checkpoint path
print(f"Stage-1 Checkpoint Path: {STAGE1_MODEL_PATH}")

# 5. Verify that the checkpoint exists
if not os.path.exists(STAGE1_MODEL_PATH):
    raise FileNotFoundError(f"Stage-1 checkpoint not found at {STAGE1_MODEL_PATH}. You must train Stage 1 first.")
else:
    print("✓ Stage-1 checkpoint verified.")

# 6. Verify that the dataset directories exist
for d in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
    if not os.path.exists(d):
        raise FileNotFoundError(f"Dataset directory missing: {d}")
print("✓ Dataset directories verified.\n")


# ============================================================
# TRANSFORMS
# ============================================================

train_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_test_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# ============================================================
# DATASETS
# ============================================================

train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_transforms)
val_dataset = datasets.ImageFolder(VAL_DIR, transform=val_test_transforms)
test_dataset = datasets.ImageFolder(TEST_DIR, transform=val_test_transforms)

class_names = train_dataset.classes
num_classes = len(class_names)

# 1. Print class names
print(f"Detected Classes: {class_names} (Total: {num_classes})")
assert set(class_names) == {"Bad", "Good", "Mixed"}, "Classes must be exactly Bad, Good, Mixed."

# 2. Print train/validation/test image counts for each class
def print_class_distribution(dataset, name):
    counts = {c: 0 for c in class_names}
    for _, label in dataset.samples:
        counts[class_names[label]] += 1
    print(f"  {name} Set: {len(dataset)} images -> {counts}")

print("\nImage Counts:")
print_class_distribution(train_dataset, "Train")
print_class_distribution(val_dataset, "Validation")
print_class_distribution(test_dataset, "Test")


train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)


# ============================================================
# MODEL SETUP (TRANSFER LEARNING)
# ============================================================

print("\nInitializing model for Stage-2 Transfer Learning...")

# Load the base EfficientNetV2-S architecture
model = efficientnet_v2_s(weights=None)
in_features = model.classifier[1].in_features

# The Stage-1 model was trained for 6 fruit classes (Apple, Banana, Guava, Lemon, Orange, Pomegranate)
# So we must temporarily set the classifier to 6 classes to successfully load its state_dict.
model.classifier[1] = nn.Linear(in_features, 6)

print(f"Loading Stage-1 weights from {STAGE1_MODEL_PATH}...")
checkpoint = torch.load(STAGE1_MODEL_PATH, map_location=DEVICE)
if "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])
else:
    model.load_state_dict(checkpoint)

# WHY STAGE-1 WEIGHTS ARE REUSED:
# We use transfer learning from Stage 1 (fruit species classification) because the convolutional 
# layers have already learned to extract domain-specific features (textures, shapes, and colors) 
# specifically relevant to fruits. This gives a massive head start compared to just using ImageNet.

# WHY THE FINAL CLASSIFICATION HEAD IS CHANGED FROM 6 CLASSES TO 3 CLASSES:
# Stage 1 classified fruit species (6 classes). Stage 2 classifies quality grades. We must discard 
# the 6-class output layer and replace it with a newly initialized 3-class linear layer to predict 
# 'Bad', 'Good', and 'Mixed' grades based on the rich features extracted by the backbone.

# WHAT THE THREE QUALITY CLASSES REPRESENT:
# - Bad: Rotten, heavily bruised, or spoiled fruit unsuitable for consumption or sale.
# - Good: Fresh, visually appealing fruit suitable for immediate retail.
# - Mixed: Fruit that has minor blemishes or mixed ripening stages, suitable for processing or discount sale.

model.classifier[1] = nn.Linear(in_features, num_classes)
model = model.to(DEVICE)
print("✓ Classifier head replaced for 3-class quality grading.")


# ============================================================
# TRAINING SETUP
# ============================================================

criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.1, patience=2)

def run_epoch(model, loader, is_train=True):
    if is_train:
        model.train()
    else:
        model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    with torch.set_grad_enabled(is_train):
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            
            if is_train:
                optimizer.zero_grad()
                
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            if is_train:
                loss.backward()
                optimizer.step()
                
            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    return running_loss / total, correct / total


# ============================================================
# TRAINING LOOP
# ============================================================

if __name__ == "__main__":
    print("\nStarting Training (CPU friendly configuration)...")
    print("=" * 60)

    best_val_acc = 0.0
    best_model_wts = copy.deepcopy(model.state_dict())
    history = []

    for epoch in range(NUM_EPOCHS):
        start_time = time.time()
        
        train_loss, train_acc = run_epoch(model, train_loader, is_train=True)
        val_loss, val_acc = run_epoch(model, val_loader, is_train=False)
        
        scheduler.step(val_acc)
        
        epoch_time = time.time() - start_time
        
        print(f"Epoch [{epoch+1}/{NUM_EPOCHS}] - {epoch_time:.0f}s")
        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}%")
        print(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc*100:.2f}%")
        
        history.append({
            "epoch": epoch + 1,
            "train_loss": train_loss,
            "train_accuracy": train_acc,
            "val_loss": val_loss,
            "val_accuracy": val_acc
        })
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_wts = copy.deepcopy(model.state_dict())
            print("  -> New best validation model found!")

    print("\nTraining completed.")


    # ============================================================
    # TEST EVALUATION
    # ============================================================

    print("\n============================================================")
    print("FINAL TEST EVALUATION")
    print("============================================================")

    model.load_state_dict(best_model_wts)
    test_loss, test_acc = run_epoch(model, test_loader, is_train=False)

    print(f"Test Accuracy: {test_acc*100:.2f}%")
    print(f"Test Loss: {test_loss:.4f}\n")

    # Detailed metrics
    model.eval()
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(DEVICE)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    print("Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=class_names))

    print("Confusion Matrix:")
    cm = confusion_matrix(all_labels, all_preds)
    print(cm)


    # ============================================================
    # SAVE ARTIFACTS
    # ============================================================

    print(f"\nSaving model weights to {STAGE2_MODEL_PATH}...")
    # Save raw state_dict for seamless loading by efficientnet_service.py
    torch.save(model.state_dict(), STAGE2_MODEL_PATH)

    print(f"Saving classes to {CLASSES_JSON_PATH}...")
    # Using exactly the 3 requested classes as an array
    with open(CLASSES_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(["Bad", "Good", "Mixed"], f, indent=4)

    print(f"Saving training history to {HISTORY_JSON_PATH}...")
    with open(HISTORY_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=4)

    print("\nDone! Stage 2 Quality Classifier is ready.")
