// @ts-ignore Node-only package provenance check.
import { assertCurrentConsumer } from "../../scripts/package-state.mjs";

export default async function verifyPackages() {
  await assertCurrentConsumer();
}
