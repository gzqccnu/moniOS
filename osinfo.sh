#!/bin/bash
# Copyright (c) 2025 gzqccnu. under Apache, GPL LICENCE
# https://github.com/gzqccnu/moniOS

source /root/tools/anaconda3/etc/profile.d/conda.sh

conda activate osinfo

cd /root/code/.code/os_info
python app.py
