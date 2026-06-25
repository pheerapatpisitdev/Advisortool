import { commissionCalculator } from '@agency/ai/flows/commission';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const result = await commissionCalculator(input);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
