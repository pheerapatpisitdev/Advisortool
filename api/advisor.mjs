import { handleAdvisor } from '../advisor/lib/http-handler.mjs';

export default async function advisorFunction(req, res) {
  return handleAdvisor(req, res);
}
