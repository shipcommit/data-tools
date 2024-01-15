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

      console.log('productUrl:', productUrl);
      console.log('chunk:', chunk);
      console.log('documentRes.embeddings[0]:', documentRes.embeddings[0]);
    }

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
