import fs from "fs";
import readline from "readline";

function escapeCSV(value: any) {
  if (value === null || value === undefined) return "";
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function run() {
  const input = fs.createReadStream("./all_hotels.jsonl");
  const output = fs.createWriteStream("./hotels.csv");

  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });

  // ✅ colonnes utiles (clean + exploitables)
  const headers = [
    "object_id",
    "name",
    "city",
    "country",
    "region",
    "lat",
    "lng",
    "address",
    "postal_code",
    "price_currency",
    "num_rooms",
    "num_reviews",
    "rating",
    "is_plus",
    "sustainable",
    "main_image",
    "michelin_url",
  ];

  output.write(headers.join(",") + "\n");

  for await (const line of rl) {
    if (!line || !line.trim()) continue;

    let h;
    try {
      h = JSON.parse(line);
    } catch {
      continue;
    }

    if (!h?.name || !h?._geoloc) continue;

    const row = [
      h.objectID,
      escapeCSV(h.name),
      escapeCSV(h.city?.name),
      escapeCSV(h.country?.name),
      escapeCSV(h.region?.name),
      h._geoloc?.lat,
      h._geoloc?.lng,
      escapeCSV(h.address?.join(" ")),
      h.postal_code,
      h.currency,
      h.num_rooms,
      h.num_reviews,
      h.feedback_stats?.meter_score,
      h.is_plus,
      h.sustainable_hotel,
      h.main_image?.hotrooms_large_url,
      h.michelin_guide_url,
    ];

    output.write(row.join(",") + "\n");
  }

  console.log("✅ CSV clean généré : hotels.csv");
}

run();
