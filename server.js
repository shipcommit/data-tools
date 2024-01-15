import Fastify from 'fastify';

// Initiate server
const fastify = Fastify({
  logger: true,
});

// Test route
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// [Route] - /vector/embed-financial data
// [Description] - Download and convert article text do vector embeddings
fastify.post('/vector/embed-financial data', async function (request, reply) {
  try {
    // This input requires raw JSON
    const json = request.body.json;

    console.log('json:', json);
    return;

    if (stringArray.length < 1) {
      throw 'Could not parse scraped article';
    }

    let scrapedArticle = '';

    for (const string of stringArray) {
      scrapedArticle += `${string}
      
            `;
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 100,
      chunkOverlap: 20,
    });

    const allSplits = await splitter.createDocuments([scrapedArticle]);

    const splitsArray = [];

    for (const obj of allSplits) {
      splitsArray.push(obj.pageContent);
    }

    console.log('splitsArray:', splitsArray);

    // Create batches
    let batchArray = [];
    const vectorArray = [];

    for (const array in splitsArray) {
      batchArray.push(splitsArray[array]);

      if (batchArray.length === 96) {
        const documentRes = await cohere.embed({
          texts: batchArray,
          model: 'embed-english-v3.0',
          inputType: 'search_document',
        });

        for (const embedding in documentRes.embeddings) {
          vectorArray.push(documentRes.embeddings[embedding]);
        }

        batchArray = [];
      }
    }

    if (batchArray.length > 0) {
      const documentRes = await cohere.embed({
        texts: batchArray,
        model: 'embed-english-v3.0',
        inputType: 'search_document',
      });

      for (const embedding in documentRes.embeddings) {
        vectorArray.push(documentRes.embeddings[embedding]);
      }
    }

    if (splitsArray.length !== vectorArray.length) {
      throw 'All of the text has not been converted to vector embeddings';
    }

    // Save vector embeddings in database
    for (const position in vectorArray) {
      // Check if the url already has been added
      const checkVector = await Vector.find({
        url: url,
        text: splitsArray[position],
      });

      // console.log('splitsArray[position]:', splitsArray[position]);
      // console.log('vectorArray[position]:', vectorArray[position]);

      if (checkVector.length > 0) {
        console.log('Vector already exists:', splitsArray[position]);

        continue;
      } else {
        const newVector = Vector({
          url: url,
          text: splitsArray[position],
          embedding: vectorArray[position],
        });

        await newVector.save();

        console.log('Vector embedding saved:', splitsArray[position]);
      }
    }

    console.log('Done with vector embeddings');
  } catch (err) {
    console.log(err);
  }
});

// Run the server
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
