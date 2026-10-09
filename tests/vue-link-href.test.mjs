import { test } from "node:test";
import assert from "node:assert/strict";
import { safeLinkHref } from "../packages/vue2/src/source/primitives/externalUrl.js";

test("Vue link hrefs keep relative and web/mail/phone URLs and drop script-capable schemes", () => {
  for (const kept of ["/components", "#api", "?page=2", "detail", "https://ui.kjun.dev", "http://example.com", "mailto:a@b.c", "tel:+821000000000"])
    assert.equal(safeLinkHref(kept), kept);
  for (const dropped of ["javascript:alert(1)", " JaVa\tScript:alert(1)", "data:text/html,<b>x</b>", "vbscript:msgbox", "", "  ", null, undefined, 42])
    assert.equal(safeLinkHref(dropped), undefined);
});
