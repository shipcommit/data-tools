import Fastify from 'fastify';
import { CohereClient } from 'cohere-ai';
import 'dotenv/config';
import mongoose from 'mongoose';

import Vector from './models/Vector.cjs';

const cohereApiKey = process.env.COHERE_API_KEY;

const cohere = new CohereClient({
  token: cohereApiKey,
});

// Initiate server
const fastify = Fastify({
  logger: true,
});

// Connect to MongoDB
const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'test',
    });

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);

    // Exit process with failure
    process.exit(1);
  }
};

connectDb();

// Test route
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// [Route] - /vector/embed-financial data
// [Description] - Download and convert article text do vector embeddings
fastify.post('/vector/embed-financial data', async function (request, reply) {
  try {
    console.log('Converting data to vector embeddings...');

    // This input requires raw JSON
    const json = request.body.json;

    // Create chunks

    for (const entry of json.feed.entry) {
      const chunk = `Produkt tittel: ${entry.title ? entry.title : ''}
      Bank: ${entry.leverandor_tekst ? entry.leverandor_tekst : ''}
      Hvor tilbudet gjelder: ${
        entry.markedsomraade ? entry.markedsomraade : ''
      } ${entry.markedsomraadeTekst ? entry.markedsomraadeTekst : ''}
      Spesielle betingelser: ${
        entry.spesielle_betingelser ? entry.spesielle_betingelser : ''
      }
      Må man være student? ${entry.student ? 'Ja' : 'Nei'}
      Trenger man en pakke? ${entry.trenger_ikke_pakke ? 'Nei' : 'Ja'}
      Må man være pensjonist? ${entry.pensjonist ? 'Ja' : 'Nei'}
        Maks sparebeløp: ${entry.maks_belop ? entry.maks_belop : 'Nei'}
        Minimum alder: ${entry.in_alder ? entry.in_alder : ''}
        Maks alder: ${entry.maks_alder ? entry.maks_alder : ''}
        Frie uttak: ${entry.frie_uttak ? entry.frie_uttak : ''}`;

      // Create vector embeddings
      const documentRes = await cohere.embed({
        texts: [chunk],
        model: 'embed-english-v3.0',
        inputType: 'search_document',
      });

      const productIdArray = entry.id.split('/');
      const productId = productIdArray[productIdArray.length - 1];

      const productUrl = `finansportalen.no/bank/bankinnskudd/product/${productId}`;

      // Save vector embeddings in database
      // Check if the url already has been added
      const checkVector = await Vector.find({
        url: productUrl,
      });

      if (checkVector.length > 0) {
        console.log('Vector already exists:', productUrl);

        continue;
      } else {
        const newVector = Vector({
          url: productUrl,
          text: chunk,
          embedding: documentRes.embeddings[0],
        });

        await newVector.save();

        console.log('Vector embedding saved:', productUrl);
      }
    }

    console.log('Done creating vector embeddings');
  } catch (err) {
    console.log(err);
  }
});

// [Route] - /vector-search
// [Description] - Search with vector query
fastify.get('/vector-search', async function (request, reply) {
  try {
    // Get query embedding
    const query = request.query.query;

    const documentRes = await cohere.embed({
      texts: [query],
      model: 'embed-english-v3.0',
      inputType: 'search_query',
    });

    const embedding = documentRes.embeddings[0];

    // console.log('embedding:', embedding);

    // Find documents
    const documents = await Vector.aggregate([
      {
        $vectorSearch: {
          queryVector: embedding,
          path: 'embedding',
          numCandidates: 500,
          limit: 5,
          index: 'vector_index',
        },
      },
    ]);

    console.log('documents:', documents);
    console.log('documents.length:', documents.length);
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
