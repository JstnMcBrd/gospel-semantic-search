from os import getenv
from flask import Flask, request
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

@app.route("/scriptures", methods=["GET"])
def get_scriptures():
	try:
		limit = int(request.args.get("limit", 5))
		
		query = request.args.get("query", None)
		if query is None:
			return "Parameter 'query' is required", 400
		vector = list(model.embed(query))[0]

		volumes = request.args.get("volumes", None)
		volumes = volumes.split(",") if volumes is not None else None

		conditions = []
		if volumes is not None:
			conditions.append(
				FieldCondition(
					key="volume",
					match=MatchAny(any=volumes),
				)
			)

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
		
		query = request.args.get("query", None)
		if query is None:
			return "Parameter 'query' is required", 400
		vector = list(model.embed(query))[0]

		min_length = int(request.args.get("min_length", 0))

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
