import { Router } from 'express';

const api = Router();

api.get('/', function (_req, res) {
  res.json({ message: 'Hello' });
});

export default api;
