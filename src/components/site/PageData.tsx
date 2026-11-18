/*
  Data the browser-side scripts need, written into the page as JSON by the server:
  · #family-data    — the assistant's vocabulary (every family and its product count), on every page
  · #catalogue-data — the catalogue, for filtering, the quick view and the enquiry desk
*/
import { getClientCatalogue, getFamilyInfo } from '@/data/catalogue';

const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

export function FamilyData() {
  return <script id="family-data" type="application/json" dangerouslySetInnerHTML={{ __html: json(getFamilyInfo()) }} />;
}

export function CatalogueData() {
  return <script id="catalogue-data" type="application/json" dangerouslySetInnerHTML={{ __html: json(getClientCatalogue()) }} />;
}
