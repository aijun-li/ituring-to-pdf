import axios from 'axios';
import axiosRetry from 'axios-retry';
import { token } from '../config.js';

const client = axios.create({
  headers: {
    Authorization: `bearer ${token}`,
    Cookie:
      '_ga=GA1.3.44750604.1696129088; _ga_E87WFG4RGE=GS1.3.1696605405.4.0.1696605405.0.0.0; .AspNetCore.Session=CfDJ8NrMSeZn3LFPr2RC%2BmHCPfHVSZnzCIeudctmFmdNyG6qG15Uml1C%2FV4EVO7q9EuZZMHvySCXBpA8bhAxt0VQdjjdyE%2BwK%2B4EepAmnizrkNld7I3LvBQuCaAwCT8qH3RGaKWqe4DFLXLUP91P3kdwlZ%2BDSeoJX%2F4x4SWgtX7agXT8',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
    Referer: 'https://www.ituring.com.cn/',
    Origin: 'https://www.ituring.com.cn',
    'sec-ch-ua':
      '"Microsoft Edge";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': 'macOS',
  },
});

axiosRetry(client, { retries: 3 });

export async function getBookInfo(id) {
  const { data } = await client.get(
    `https://api.ituring.com.cn/api/Book/${id}`,
  );

  return {
    name: data.name,
    chapters: data.ebook.chapters,
    id: data.id,
    coverKey: data.coverKey,
  };
}

export async function getChapterContent(id) {
  const { data } = await client.get(
    `https://api.ituring.com.cn/api/Book/Tupub/${id}`,
  );
  return data.htmlOfBody;
}
