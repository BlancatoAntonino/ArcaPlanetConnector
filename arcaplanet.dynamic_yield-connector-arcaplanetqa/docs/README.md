# 🔗 VTEX - Dynamic Yield Product Feed Connector

Questo connettore genera e sincronizza automaticamente il **feed dei prodotti VTEX** con la piattaforma **Dynamic Yield**, abilitando personalizzazioni, raccomandazioni e contenuti dinamici su misura per il cliente finale.

---

## 🎯 Obiettivo

- Estrazione dei prodotti dal catalogo VTEX.
- Formattazione secondo le specifiche Dynamic Yield.
- Invio del feed via API, URL pubblico o file.

---

## Note tecniche

### CronJob Ids (STAGING)

- d12b9b6d-5024-4022-a267-1061c296771a -> bulkUpdate
- 3d14e6bd-69eb-44c9-93a8-c5fe7c9e09cc -> updateFranchiseAccountAvailability
- b56fb7a0-0ba9-49ec-9d39-1482aff3333d

### CornJob Ids (PROD)

- 9dfb187d-4465-41ff-b8eb-bd9607ca2aee -> bulkUpdate
- 776d210a-def9-4d05-a70b-24537e76ef86 -> updateFranchiseAccountAvailability
- 30351285-b58e-4b9d-8179-70706860abdc -> ping