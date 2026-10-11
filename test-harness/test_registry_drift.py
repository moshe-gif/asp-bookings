"""
The README registries are the contract for what the harness offers ("if it's not listed here,
assume it doesn't exist") -- so keep them honest automatically (2026-10-09 audit 7.4): every spec
file and every public helper in helpers.py must have a row in README.md.
"""
import ast
import pathlib

HERE = pathlib.Path(__file__).parent
README = (HERE / "README.md").read_text()


def test_every_spec_file_is_in_the_registry():
    missing = [p.name for p in sorted(HERE.glob("test_*.py")) if f"`{p.name}`" not in README]
    assert not missing, f"add a README registry row for: {missing}"


def test_every_public_helper_is_in_the_registry():
    tree = ast.parse((HERE / "helpers.py").read_text())
    names = [n.name for n in tree.body if isinstance(n, ast.FunctionDef) and not n.name.startswith("_")]
    missing = [n for n in names if f"`{n}(" not in README and f"`{n}`" not in README]
    assert not missing, f"add a README registry row for helpers: {missing}"
