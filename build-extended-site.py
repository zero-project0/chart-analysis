"""Compatibility entry point for the complete historical rebuild."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('rebuild-data.py')),run_name='__main__')
