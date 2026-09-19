# Gospel Semantic Search

*Final project for C S 574*

![header](./web/public/header.png)

## Sources

**Scriptures**: automatically downloaded from [beandog/lds-scriptures](https://github.com/beandog/lds-scriptures).

**General Conference**: scraped from the Church website and compiled into `genconf.csv`.

**Disclaimer**: General Conference talks are copyrighted, so I cannot publish the dataset on GitHub. I have my own local copy of `genconf.csv`.

## Usage

Seed the database (only needs to be done once):

```sh
docker compose up db-init
```

Start the application services:

```sh
docker compose up
```

View the web app at `http://localhost:8080`.

## Key NLP concepts

- Sentence transformers
- Quantization / CPU optimization
- Long document chunking
- Vector databases
- HNSW vector index
- Vector similarity search

## Other concepts:

- Docker / Docker Compose
- QDrant
- Flask
- Simple web design
