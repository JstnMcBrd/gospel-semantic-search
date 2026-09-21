from os import getenv
from flask import Flask, request
from html import escape
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchAny, Range
from fastembed import TextEmbedding

app = Flask(__name__)

DB_HOST = getenv("DB_HOST", "db")
DB_PORT = int(getenv("DB_PORT", 6333))
client = QdrantClient(host=DB_HOST, port=DB_PORT)

model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

@app.route("/status", methods=["GET"])
def health():
	try:
		client.get_collections()
		return "Connected", 200
	except Exception:
		app.logger.exception("Database health check failed")
		return "Unable to connect to the database", 500

VALID_VOLUMES = set(["Old Testament", "New Testament", "Book of Mormon", "Doctrine and Covenants", "Pearl of Great Price"])

@app.route("/scriptures", methods=["GET"])
def get_scriptures():
	try:
		limit = int(request.args.get("limit", 5))
		if limit < 1:
			return "Parameter 'limit' must at least 1", 400
		if limit > 100:
			return "Parameter 'limit' cannot exceed 100", 400

		volumes = request.args.get("volumes", None)
		volumes = None if volumes is None else [] if volumes == "" else volumes.split(",")
		for volume in volumes or []:
			if volume not in VALID_VOLUMES:
				return f"Invalid volume '{escape(volume)}'", 400

		conditions = []
		if volumes is not None:
			conditions.append(
				FieldCondition(
					key="volume",
					match=MatchAny(any=volumes),
				)
			)

		query = request.args.get("query", None)
		query = query.strip() if query is not None else None
		if query is None or query == "":
			return "Parameter 'query' is required", 400
		if len(query) > 1000:
			return "Parameter 'query' cannot exceed 1000 characters", 400
		vector = list(model.embed(query))[0]

		response = client.query_points(
			collection_name="scriptures",
			query=vector,
			query_filter=Filter(must=conditions),
			limit=limit,
			with_payload=True,
		)

		results = [
			{
				"score": point.score,
				"name": point.payload.get("name", ""),
				"text": point.payload.get("text", ""),
				"url": point.payload.get("url", ""),
			}
			for point in response.points
		]

		return { "results": results }, 200
	except Exception:
		app.logger.exception("Scripture search failed")
		return "Unable to retrieve scriptures", 500

@app.route("/genconf", methods=["GET"])
def get_genconf():
	try:
		limit = int(request.args.get("limit", 5))
		if limit < 1:
			return "Parameter 'limit' must at least 1", 400
		if limit > 100:
			return "Parameter 'limit' cannot exceed 100", 400

		min_length = int(request.args.get("min_length", 0))
		if min_length < 0:
			return "Parameter 'min_length' cannot be negative", 400

		conditions = []
		if min_length > 0:
			conditions.append(
				FieldCondition(
					key="length",
					range=Range(
						gte=min_length,
					),
				),
			)
		
		query = request.args.get("query", None)
		query = query.strip() if query is not None else None
		if query is None or query == "":
			return "Parameter 'query' is required", 400
		if len(query) > 1000:
			return "Parameter 'query' cannot exceed 1000 characters", 400
		vector = list(model.embed(query))[0]

		response = client.query_points(
			collection_name="genconf",
			query=vector,
			query_filter=Filter(must=conditions),
			limit=limit,
			with_payload=True,
		)

		results = [
			{
				"score": point.score,
				"url": point.payload.get("url", ""),
				"date": point.payload.get("date", ""),
				"title": point.payload.get("title", ""),
				"author": point.payload.get("author", ""),
				"text": point.payload.get("text", ""),
			}
			for point in response.points
		]

		return { "results": results }, 200
	except Exception:
		app.logger.exception("General conference search failed")
		return "Unable to retrieve general conference results", 500

if __name__ == "__main__":
	app.run(host="::", port=5000)
