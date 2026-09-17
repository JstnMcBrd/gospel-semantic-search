#!/usr/bin/env python

from os import getenv, path
from tqdm import tqdm
import pandas as pd
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, HnswConfigDiff, PointStruct

DB_HOST = getenv("DB_HOST", "db")
DB_PORT = int(getenv("DB_PORT", 6333))
client = QdrantClient(host=DB_HOST, port=DB_PORT)

model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

def embed_scriptures():
	if client.collection_exists("scriptures"):
		print("Scriptures already exist. Skipping...")
		return

	# Load data
	url = "https://raw.githubusercontent.com/beandog/lds-scriptures/42e4bd73a216626b848cd1c75a79a8040799aca7/csv/lds-scriptures.csv"
	df = pd.read_csv(url, keep_default_na=False)

	# Generate documents
	df["id"] = [
		int(f"{vl}{bk}{ch}{vr}")
		for vl, bk, ch, vr in zip(df["volume_id"],
					  df["book_id"],
					  df["chapter_id"],
					  df["verse_id"])
	]
	df["url"] = [
		f"https://www.churchofjesuschrist.org/study/scriptures/{vl}/{bk}/{ch}?id=p{vr}#p{vr}"
		for vl, bk, ch, vr in zip(df["volume_lds_url"],
					  df["book_lds_url"],
					  df["chapter_number"],
					  df["verse_number"])
	]
	df["vector"] = list(tqdm(model.embed(df["scripture_text"], batch_size=1),
				 total=len(df["scripture_text"]),
				 desc="Embedding sciptures..."))

	# Upload documents
	client.create_collection(
		collection_name="scriptures",
		vectors_config=VectorParams(size=model.embedding_size,
					    distance=Distance.COSINE,
					    hnsw_config=HnswConfigDiff(m=16, ef_construct=200)),
	)
	client.upload_points(
		collection_name="scriptures",
		points=[
			PointStruct(
				id=row["id"],
				vector=row["vector"],
				payload={
					"name": row["verse_title"],
					"text": row["scripture_text"],
					"volume": row["volume_title"],
					"book": row["book_title"],
					"url": row["url"],
				},
			)
			for _, row in df.iterrows()
		],
	)

def embed_genconf():
	if client.collection_exists("genconf"):
		print("General conference talks already exist. Skipping...")
		return

	# Load data
	# The genconf dataset contains copyrighted data and cannot be published, so you must have a local copy
	if not path.exists("./genconf.csv"):
		print("Genconf dataset not found - cannot build genconf collection")
		return
	df = pd.read_csv("./genconf.csv")

	# Generate documents
	df["text"] = df["text"].str.split("\n")
	df = df.explode("text", ignore_index=True)
	df = df[df["text"].str.strip() != ""]
	df["vector"] = list(tqdm(model.embed(df["text"], batch_size=1),
				 total=len(df["text"]),
				 desc="Embedding general conference..."))

	# Upload documents
	client.create_collection(
		collection_name="genconf",
		vectors_config=VectorParams(size=model.embedding_size,
					    distance=Distance.COSINE,
					    hnsw_config=HnswConfigDiff(m=16, ef_construct=200)),
	)
	client.upload_points(
		collection_name="genconf",
		points=[
			PointStruct(
				id=i,
				vector=row["vector"],
				payload={
					"url": row["url"],
					"date": row["date"],
					"title": row["title"],
					"author": row["author-name"],
					"text": row["text"],
					"length": len(row["text"]),
				},
			)
			for i, row in df.iterrows()
		],
	)

if __name__ == "__main__":
	embed_scriptures()
	embed_genconf()
