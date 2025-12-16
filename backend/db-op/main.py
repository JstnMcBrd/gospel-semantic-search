#!/usr/bin/env python

from os import getenv
from qdrant_client import QdrantClient

DB_HOST = getenv("DB_HOST", "db")
DB_PORT = int(getenv("DB_PORT", 6333))
client = QdrantClient(host=DB_HOST, port=DB_PORT)

# Add any database operation here
