import { describe, expect, it } from "vitest";
import { normalTitle, parseCapture, sameTask, splitDump } from "./parse";

// Friday 6 Nov 2026.
const TODAY = "2026-11-06";
const p = (s: string) => parseCapture(s, TODAY);

describe("parseCapture", () => {
  it("leaves a plain title alone", () => {
    expect(p("Call the accountant about Q3")).toEqual({ title: "Call the accountant about Q3", today: false, due: null, starred: false });
  });

  it("puts 'today' straight onto Today and strips it", () => {
    expect(p("pay rent today")).toMatchObject({ title: "pay rent", today: true, due: null });
    expect(p("reply to Sam by today")).toMatchObject({ title: "reply to Sam", today: true });
    expect(p("call mum tonight")).toMatchObject({ title: "call mum", today: true });
  });

  it("reads relative days", () => {
    expect(p("send invoice tomorrow")).toMatchObject({ title: "send invoice", due: "2026-11-07" });
    expect(p("renew domain in 3 days")).toMatchObject({ title: "renew domain", due: "2026-11-09" });
    expect(p("plan offsite in 2 weeks")).toMatchObject({ title: "plan offsite", due: "2026-11-20" });
    expect(p("review metrics next week")).toMatchObject({ title: "review metrics", due: "2026-11-09" });
  });

  it("reads weekdays, but not ordinary words that look like them", () => {
    expect(p("call sam fri")).toMatchObject({ title: "call sam", today: true }); // it is Friday
    expect(p("ship deck by monday")).toMatchObject({ title: "ship deck", due: "2026-11-09" });
    expect(p("ship deck on tue")).toMatchObject({ title: "ship deck", due: "2026-11-10" });
    expect(p("next friday board prep")).toMatchObject({ title: "board prep", due: "2026-11-13" });
    expect(p("buy sun cream")).toMatchObject({ title: "buy sun cream", due: null });
    expect(p("sat with the team on pricing")).toMatchObject({ due: null });
  });

  it("reads calendar dates, rolling past ones into next year", () => {
    expect(p("tax filing 12 nov")).toMatchObject({ title: "tax filing", due: "2026-11-12" });
    expect(p("tax filing by nov 12th")).toMatchObject({ title: "tax filing", due: "2026-11-12" });
    expect(p("renew passport 3 feb")).toMatchObject({ due: "2027-02-03" });
    expect(p("renew passport 3 feb 2028")).toMatchObject({ due: "2028-02-03" });
    expect(p("pay on 31 feb")).toMatchObject({ due: null });
  });

  it("stars with a lone or leading !", () => {
    expect(p("! fix checkout")).toMatchObject({ title: "fix checkout", starred: true });
    expect(p("!fix checkout")).toMatchObject({ title: "fix checkout", starred: true });
    expect(p("fix checkout !!")).toMatchObject({ title: "fix checkout", starred: true });
    expect(p("ship it!")).toMatchObject({ title: "ship it!", starred: false });
  });

  it("combines", () => {
    expect(p("! investor update tomorrow")).toEqual({ title: "investor update", today: false, due: "2026-11-07", starred: true });
  });

  it("keeps the words when parsing would eat everything", () => {
    expect(p("tomorrow")).toMatchObject({ title: "tomorrow", due: "2026-11-07" });
  });
});

describe("leaves real words alone", () => {
  it.each([
    ["Reply to USA Today journalist", { title: "Reply to USA Today journalist", today: false }],
    ["review today's numbers", { title: "review today's numbers", today: false }],
    ["prep tomorrow's agenda", { title: "prep tomorrow's agenda", due: null }],
    ["Pass the SAT", { title: "Pass the SAT", due: null }],
    ["put on sun cream", { title: "put on sun cream", due: null }],
    ["email Sun", { title: "email Sun", due: null }],
    ["plan weekend offsite", { title: "plan weekend offsite", due: null }],
    ["review monday's standup notes", { title: "review monday's standup notes", due: null }],
  ])("%s", (input, expected) => {
    expect(p(input)).toMatchObject(expected);
  });

  it("still reads the forms people really type", () => {
    expect(p("Today: pay rent")).toMatchObject({ title: "pay rent", today: true });
    expect(p("ship deck by Mon")).toMatchObject({ title: "ship deck", due: "2026-11-09" });
    expect(p("ship deck by Monday")).toMatchObject({ title: "ship deck", due: "2026-11-09" });
    expect(p("plan offsite this weekend")).toMatchObject({ title: "plan offsite", due: "2026-11-07" });
    expect(p("clean garage weekend")).toMatchObject({ title: "clean garage", due: "2026-11-07" });
  });

  it("lets a tapped chip turn a reading off", () => {
    expect(p("Read The Weekend Today")).toMatchObject({ today: false });
    expect(parseCapture("pay rent today", TODAY, { today: true })).toMatchObject({ title: "pay rent today", today: false });
    expect(parseCapture("send invoice tomorrow", TODAY, { due: true })).toMatchObject({ title: "send invoice tomorrow", due: null });
    expect(parseCapture("! fix it", TODAY, { star: true })).toMatchObject({ starred: false });
  });
});

describe("splitDump", () => {
  it("strips bullets, numbers and checkboxes", () => {
    expect(splitDump("- one\n* two\n• three\n4. four\n[ ] five\n- [ ] six\n\n   \nseven")).toEqual([
      "one", "two", "three", "four", "five", "six", "seven",
    ]);
  });

  it("skips lines already done or moved, and keeps numbers that aren't bullets", () => {
    expect(splitDump("[x] shipped\n- [x] also done\n[>] sent on\n1.5x growth plan\n2) real item")).toEqual([
      "1.5x growth plan", "real item",
    ]);
  });
});

describe("sameTask", () => {
  it("matches the same thought written differently", () => {
    expect(sameTask("Call accountant", "call accountant!")).toBe(true);
    expect(sameTask("Email Priya about the contract", "email the contract to priya")).toBe(false);
    expect(sameTask("update investor deck numbers", "investor deck: update numbers")).toBe(true);
  });

  it("refuses to merge short titles that only overlap", () => {
    expect(sameTask("Call mum", "Call dad")).toBe(false);
    expect(sameTask("fix bug", "fix bug report")).toBe(false);
  });

  it("normalises accents and punctuation", () => {
    expect(normalTitle("  Café — RÉSUMÉ!! ")).toBe("cafe resume");
  });
});
