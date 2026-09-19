const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const PDF_PATH =
    './data/Daily Official List - Equities for 18-09-2026.pdf';

async function testPDF() {
    let parser = null;

    try {
        console.log('Reading NGX PDF...');

        const buffer = fs.readFileSync(PDF_PATH);

        console.log(`PDF size: ${buffer.length} bytes`);

        parser = new PDFParse({
            data: buffer
        });

        const result = await parser.getText();

        console.log('');
        console.log('================================');
        console.log('NGX PDF EXTRACTION TEST');
        console.log('================================');

        console.log(`Pages: ${result.total}`);
        console.log(`Characters: ${result.text.length}`);

        console.log('');
        console.log('--- FIRST 5000 CHARACTERS ---');
        console.log('');

        console.log(result.text.slice(0, 5000));

        console.log('');
        console.log('================================');
        console.log('PDF EXTRACTION SUCCESS');
        console.log('================================');
    } catch (error) {
        console.error('');
        console.error('================================');
        console.error('PDF EXTRACTION FAILED');
        console.error('================================');
        console.error(error);
        process.exit(1);
    } finally {
        if (parser) {
            await parser.destroy();
        }
    }
}

testPDF();