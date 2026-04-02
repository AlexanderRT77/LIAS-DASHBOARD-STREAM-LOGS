// Vercel Serverless Function: Ponte de Segurança para NewsAPI
// Isso faz o pedido pelo servidor, contornando a trava de navegador do plano gratuito.

export default async function handler(req, res) {
  const { query = '(artificial intelligence OR AI) AND (health OR medicine OR medical OR clinical)' } = req.query;
  const apiKey = process.env.VITE_NEWS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'VITE_NEWS_API_KEY não configurada na Vercel.' });
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=pt&pageSize=10&apiKey=${apiKey}`
    );
    let data = await response.json();

    // Se falhar em PT, tenta em EN
    if (data.status === 'ok' && data.articles.length === 0) {
      const respEn = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}`
      );
      data = await respEn.json();
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}
