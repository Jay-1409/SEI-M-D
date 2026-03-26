from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def load_module(module_path: str, module_name: str):
    """
    Load a module from an explicit path with a unique import name.
    """
    path = REPO_ROOT / module_path
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Failed to create module spec for {module_path}")

    module = importlib.util.module_from_spec(spec)

    # Allow local sibling imports like `from models import ...`.
    sys.path.insert(0, str(path.parent))
    try:
        spec.loader.exec_module(module)
    finally:
        sys.path.pop(0)

    return module
