#!/bin/bash

source /root/tools/anaconda3/etc/profile.d/conda.sh

conda activate osinfo

cd /root/code/.code/os_info
python app.py
