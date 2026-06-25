import { agentIncomeCalculator } from '@agency/ai/flows/agent-income';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await agentIncomeCalculator(input);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
