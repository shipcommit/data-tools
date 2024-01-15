import Fastify from 'fastify';
import { CohereClient } from 'cohere-ai';
import 'dotenv/config';

const cohereApiKey = process.env.COHERE_API_KEY;

const cohere = new CohereClient({
  token: cohereApiKey,
});

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
    console.log('Converting data to vector embeddings...');

    // This input requires raw JSON
    const json = request.body.json;

    // Create chunks
    const chunksArray = [];

    for (const offer of json.feed.entry) {
      const chunk = `Produkt tittel: ${offer.title ? offer.title : ''}
      Bank: ${offer.leverandor_tekst ? offer.leverandor_tekst : ''}
      Hvor tilbudet gjelder: ${
        offer.markedsomraade ? offer.markedsomraade : ''
      } ${offer.markedsomraadeTekst ? offer.markedsomraadeTekst : ''}
      Spesielle betingelser: ${
        offer.spesielle_betingelser ? offer.spesielle_betingelser : ''
      }
      Må man være student? ${offer.student ? 'Ja' : 'Nei'}
      Trenger man en pakke? ${offer.trenger_ikke_pakke ? 'Nei' : 'Ja'}
      Må man være pensjonist? ${offer.pensjonist ? 'Ja' : 'Nei'}
        Maks sparebeløp: ${offer.maks_belop ? offer.maks_belop : 'Nei'}
        Maks alder: ${offer.maks_alder ? offer.maks_alder : ''}
        Frie uttak: ${offer.frie_uttak ? offer.frie_uttak : ''}`;

      chunksArray.push(chunk);
    }

    // Create vector embeddings
    let batchArray = [];
    const vectorArray = [];

    for (const array in chunksArray) {
      batchArray.push(chunksArray[array]);

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

    if (chunksArray.length !== vectorArray.length) {
      throw 'All of the text has not been converted to vector embeddings';
    }

    console.log('vectorArray:', vectorArray);

    return;

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
