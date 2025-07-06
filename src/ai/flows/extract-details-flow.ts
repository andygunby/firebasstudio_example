
'use server';
/**
 * @fileOverview An AI flow to extract personal details from a document.
 *
 * - extractDetails - A function that handles the detail extraction process.
 * - ExtractDetailsInput - The input type for the extractDetails function.
 * - ExtractDetailsOutput - The return type for the extractDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDetailsInputSchema = z.object({
  fileDataUri: z.string().describe("A document (PDF or TXT) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ExtractDetailsInput = z.infer<typeof ExtractDetailsInputSchema>;

const ExtractDetailsOutputSchema = z.object({
  firstName: z.string().optional().describe("The person's first name. Example: 'John'"),
  surname: z.string().optional().describe("The person's surname or last name. Example: 'Doe'"),
  address: z.string().optional().describe("The complete street address, including city, but NOT the postcode. Example: '123 Main St, Anytown'"),
  postcode: z.string().optional().describe("The postcode or ZIP code. Example: 'AN1 1AA' or '12345'"),
  email: z.string().optional().describe("The person's email address. Example: 'john.doe@example.com'"),
  favoriteTimeOfDay: z.string().optional().describe("The person's favorite time of day. This must be one of the following values: 'Morning', 'Afternoon', 'Evening', 'Night'. Infer from context if possible."),
});
export type ExtractDetailsOutput = z.infer<typeof ExtractDetailsOutputSchema>;

export async function extractDetails(input: ExtractDetailsInput): Promise<ExtractDetailsOutput> {
  return extractDetailsFlow(input);
}

const extractPrompt = ai.definePrompt({
  name: 'extractDetailsPrompt',
  input: {schema: ExtractDetailsInputSchema},
  output: {schema: ExtractDetailsOutputSchema},
  prompt: `You are a highly-trained data extraction model. Your task is to analyze the document provided and extract the user's personal details into a structured JSON format based on the provided schema.

Carefully examine the document below. Identify the following distinct pieces of information:
- The person's **first name**.
- The person's **surname** or last name.
- The full street **address**. This should include the street, city, and any other lines, but you MUST exclude the postcode.
- The **postcode**. This is usually an alphanumeric code at the end of the address.
- The **email address**, which contains an "@" symbol.
- The person's **favorite time of day**. This value must be one of: 'Morning', 'Afternoon', 'Evening', 'Night'. If the document mentions a preference like 'I'm a night owl' or 'I love sunrises', infer the correct value.

If you cannot find a specific piece of information, return an empty string "" for that field. Do not omit any keys from the final JSON object.

DOCUMENT:
---
{{media url=fileDataUri}}
---

Now, provide the extracted data in the format defined by the output schema.
`,
});

const extractDetailsFlow = ai.defineFlow(
  {
    name: 'extractDetailsFlow',
    inputSchema: ExtractDetailsInputSchema,
    outputSchema: ExtractDetailsOutputSchema,
  },
  async (input) => {
    const {output} = await extractPrompt(input);
    return output!;
  }
);
