#!/usr/bin/env python3
import argparse
import json
import sys
import urllib.parse

parser = argparse.ArgumentParser(description='Generate domains yaml from tsv file')
parser.add_argument('source_file', type=str, help='tsv file containing clients and domains')
parser.add_argument('-o', dest='output', type=str, help='Output file')
args = parser.parse_args()

clients = {}
with open(args.source_file, 'r') as source_file:
  for line in [line.strip() for line in source_file]:
    client = urllib.parse.quote_plus(line.split('\t')[0])
    domain = line.split('\t')[1]
    if client not in clients.keys():
      clients[client] = []
    clients[client].append(domain)

output_file = args.output and open(args.output, 'w') or sys.stdout
output_file.write(json.dumps({'clients': clients}, sort_keys=True, indent=4))
output_file.close()

