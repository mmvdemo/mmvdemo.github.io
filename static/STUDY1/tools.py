import json
import os
import numpy as np

def main():
    files = list(os.walk('.'))[0][2]
    maxValues = {}
    for s in files:
        if ('.py' in s) or ('.swp' in s):
            continue
        with open(s,'r') as f:
            data = json.load(f)
            values = np.array(data["values"])
            maxValues[s[:-5]] = np.max(values)

    with open("max_value.json",'w') as f:
        json.dump(maxValues,f)

if __name__ == "__main__":
    main()
