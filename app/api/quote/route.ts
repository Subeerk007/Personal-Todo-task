import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://zenquotes.io/api/random", {
      next: { revalidate: 86400 }, // cache for 24 hours
    });

    if (!res.ok) {
      throw new Error(`ZenQuotes API returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      [
        {
          q: "A little progress each day adds up to big results.",
          a: "Satya Nani",
        },
      ],
      { status: 200 }
    );
  }
}
