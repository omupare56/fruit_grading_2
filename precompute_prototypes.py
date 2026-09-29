import os
import sys
import pickle

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
from backend.services.fruit_classifier import _build_proto_map

def run():
    print('Building prototypes...')
    proto_map, err = _build_proto_map()
    if err:
        print('Error:', err)
        sys.exit(1)
    
    out_path = os.path.join('backend', 'models', 'fruit_classifier', 'prototypes.pkl')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'wb') as f:
        pickle.dump(proto_map, f)
    
    print('Successfully saved prototypes to', out_path)

if __name__ == '__main__':
    run()
