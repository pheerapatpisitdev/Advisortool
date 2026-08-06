const MAX_MESSAGE = 2400;

export function validateAdvisorRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('คำขอไม่ถูกต้อง');
  if (!Array.isArray(value.messages) || value.messages.length < 1 || value.messages.length > 12) throw new RangeError('จำนวนข้อความต้องอยู่ระหว่าง 1–12');
  const messages = value.messages.map((message) => {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') throw new TypeError('รูปแบบข้อความไม่ถูกต้อง');
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE) throw new RangeError(`ข้อความต้องไม่เกิน ${MAX_MESSAGE} ตัวอักษร`);
    return { role: message.role, content };
  });
  if (messages.at(-1).role !== 'user') throw new TypeError('ข้อความสุดท้ายต้องมาจากผู้ใช้');
  const rawProfile = value.profile && typeof value.profile === 'object' && !Array.isArray(value.profile) ? value.profile : {};
  const age = rawProfile.age === '' || rawProfile.age == null ? null : Number(rawProfile.age);
  if (age != null && (!Number.isInteger(age) || age < 0 || age > 100)) throw new RangeError('อายุไม่ถูกต้อง');
  const budgetMonthly = rawProfile.budgetMonthly === '' || rawProfile.budgetMonthly == null ? null : Number(rawProfile.budgetMonthly);
  if (budgetMonthly != null && (!Number.isFinite(budgetMonthly) || budgetMonthly < 0 || budgetMonthly > 10_000_000)) throw new RangeError('งบประมาณไม่ถูกต้อง');
  const profile = {
    age,
    gender: ['male', 'female', 'unspecified'].includes(rawProfile.gender) ? rawProfile.gender : 'unspecified',
    budgetMonthly,
    goals: Array.isArray(rawProfile.goals) ? rawProfile.goals.filter((goal) => typeof goal === 'string').slice(0, 5) : []
  };
  return { messages, profile };
}
