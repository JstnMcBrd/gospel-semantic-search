import csv
from io import TextIOWrapper
from os import getenv, path
from urllib.request import urlopen

from tqdm import tqdm
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
	with urlopen(url) as response:
		rows = list(csv.DictReader(TextIOWrapper(response, encoding="utf-8")))

	vectors = model.embed([row["scripture_text"] for row in rows], batch_size=1)
	vectors = tqdm(vectors,
				 total=len(rows),
				 desc="Embedding sciptures...")

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
				id=int(f'{row["volume_id"]}{row["book_id"]}{row["chapter_id"]}{row["verse_id"]}'),
				vector=vector,
				payload={
					"name": row["verse_title"],
					"text": row["scripture_text"],
					"volume": row["volume_title"],
					"book": row["book_title"],
					"url": f'https://www.churchofjesuschrist.org/study/scriptures/{row["volume_lds_url"]}/{row["book_lds_url"]}/{row["chapter_number"]}?id=p{row["verse_number"]}#p{row["verse_number"]}',
				},
			)
			for row, vector in zip(rows, vectors)
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
	with open("./genconf.csv", encoding="utf-8", newline="") as csv_file:
		paragraphs = [
			(index, row, text)
			for index, (row, text) in enumerate(
				(row, text)
				for row in csv.DictReader(csv_file)
				for text in row["text"].split("\n")
			)
			if text.strip()
		]

	vectors = model.embed([text for _, _, text in paragraphs], batch_size=1)
	vectors = tqdm(vectors,
				 total=len(paragraphs),
				 desc="Embedding general conference...")

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
				id=index,
				vector=vector,
				payload={
					"url": row["url"],
					"date": row["date"],
					"title": row["title"],
					"author": row["author-name"],
					"text": text,
					"length": len(text),
				},
			)
			for (index, row, text), vector in zip(paragraphs, vectors)
		],
	)

if __name__ == "__main__":
	embed_scriptures()
	embed_genconf()
