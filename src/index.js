import fs from 'fs/promises';
import { getBookInfo, getChapterContent } from './service.js';
import axios from 'axios';
import PDFMerger from 'pdf-merger-js';
import puppeteer from 'puppeteer';
import { outlinePdfFactory } from '@lillallol/outline-pdf';
import pdfLib, { PDFDocument } from 'pdf-lib';
import { bookId, calcLevel } from '../config.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = resolve(__dirname, '../output');
const TEMP_DIR = `${OUTPUT_DIR}/.temp`;

const customCss = await fs.readFile(resolve(__dirname, 'style.css'));
const highlightCss = await axios
  .get(
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css',
  )
  .then((res) => res.data);
const highlightScript = await axios
  .get(
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js',
  )
  .then((res) => res.data);

function createHTML(content) {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Document</title>',
    `<style>${customCss}</style>`,
    `<style>${highlightCss}</style>`,
    `<script id="highlight">${highlightScript}</script>`,
    '</head>',
    '<body>',
    '<div class="article">',
    content,
    '</div>',
    '<script>hljs.highlightAll();</script>',
    '</body>',
    '</html>',
  ].join('\n');
}

function getCoverImage(coverKey) {
  return `
    <img
      class="book-cover"
      src="https://file.ituring.com.cn/LargeCover/${coverKey}"
    />
  `;
}

function createOutlineEntry(pageNum, title, level) {
  return `${pageNum}|${'-'.repeat(level - 1)}|${title}`;
}

async function createPDF(chapters, { name, id, coverKey }) {
  const tempDir = `${TEMP_DIR}/${id}`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const merger = new PDFMerger();

  let nextPage = 2;
  const outlinePdf = outlinePdfFactory(pdfLib);
  const outlines = [];

  // create conver pdf
  process.stdout.write('(2/5) Downloading cover...');
  const tempCover = `${tempDir}/cover.pdf`;
  const cover = await browser.newPage();
  await cover.setContent(createHTML(getCoverImage(coverKey)), {
    waitUntil: 'load',
    timeout: 0,
  });
  await cover.pdf({
    path: tempCover,
    format: 'A4',
  });
  await cover.close();
  await merger.add(tempCover);
  console.log('\r(2/5) Downloading cover... Done!');

  // create chapter pdfs
  process.stdout.write(`\r(3/5) Downloading chapters... 0/${chapters.length}`);
  for (const index in chapters) {
    const chapter = chapters[index];
    const chapterFile = `${tempDir}/${chapter.id}.pdf`;

    const text = await getChapterContent(chapter.id);

    const page = await browser.newPage();
    await page.setContent(createHTML(text), { waitUntil: 'load', timeout: 0 });

    await page.pdf({
      path: chapterFile,
      format: 'A4',
      margin: { top: 50, bottom: 50, left: 54, right: 54 },
    });
    await page.close();

    // record outline info
    const tempFile = await fs.readFile(chapterFile);
    const tempPDF = await PDFDocument.load(tempFile);
    const tempCount = tempPDF.getPageCount();
    const level = calcLevel(chapter);
    outlines.push(createOutlineEntry(nextPage, chapter.subject, level));
    nextPage += tempCount;

    await merger.add(chapterFile);

    process.stdout.write(
      `\r(3/5) Downloading chapters... ${Number(index) + 1}/${chapters.length}`,
    );
  }

  await browser.close();

  console.log();

  process.stdout.write('(4/5) Merging chapters...');

  const mergedTempFile = `${tempDir}/${id}.pdf`;
  await merger.save(mergedTempFile);

  console.log('\r(4/5) Merging chapters... Done!');

  process.stdout.write('(5/5) Creating outline...');
  const pdf = await fs.readFile(mergedTempFile, { encoding: 'base64' });
  const outline = outlines.join('\n');
  const outlinedPDF = await outlinePdf({ outline, pdf }).then((pdfDocument) =>
    pdfDocument.save(),
  );
  console.log('\r(5/5) Creating outline... Done!');

  await fs.writeFile(`${OUTPUT_DIR}/${name}.pdf`, outlinedPDF);
  console.log('Book generated successfully!');
}

async function run(bookId) {
  try {
    process.stdout.write('(1/5) Fetching meta...');
    const bookInfo = await getBookInfo(bookId);
    const { chapters, name, id } = bookInfo;

    console.log(`\r(1/5) Fetching meta... Done! ==> ${name}`);

    const tempDir = `${TEMP_DIR}/${id}`;

    await fs.rm(TEMP_DIR, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    await createPDF(chapters, bookInfo);
  } catch (error) {
    console.log();
    console.error(error);
  } finally {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  }
}

run(bookId);
