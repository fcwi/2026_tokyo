import React from "react";

export const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getMessageRegex = (itineraryData, shopGuideData) => {
  const allKeywordsRaw = [
    ...itineraryData.flatMap((day) => day.events.map((e) => e.title)),
    ...shopGuideData.flatMap((area) => area.mainShops.map((s) => s.name)),
  ];
  const filtered = allKeywordsRaw.filter((k) => k && k.length >= 2);
  const set = new Set(filtered);
  const pattern = filtered.map(escapeRegex).join("|");
  const regex = new RegExp(
    `(https?://[^\\s]+)|(${pattern})|(\\*\\*.*?\\*\\*)`,
    "g",
  );
  return { keywordsSet: set, combinedRegex: regex };
};

export const renderFormattedMessage = (text, combinedRegex, keywordsSet) => {
  if (!text) return null;

  return text.split(combinedRegex).map((part, index) => {
    if (!part) return null;

    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-500 underline"
        >
          {part}
        </a>
      );
    }

    if (keywordsSet && keywordsSet.has(part)) {
      return (
        <a
          key={index}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(part)}`}
          className="text-orange-500 font-bold border-b border-dashed border-orange-400 hover:text-orange-400"
        >
          {part}
        </a>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
};
