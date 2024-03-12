import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());
const prisma = new PrismaClient();
const PORT = 5000;

app.get("/locus", async (req, res) => {
  const { id, assembly_id, region_id, membership_status } = req.query;

  if (
    id &&
    region_id &&
    Number.isNaN(Number(id)) &&
    Number.isNaN(Number(region_id))
  )
    return res.status(400).send();

  const page = req.query.page ? Number(req.query.page) : undefined;
  const page_size = req.query.page_size ? Number(req.query.page_size) : 10;

  const locuses = await prisma.rnc_locus.findMany({
    skip: page && (page - 1) * page_size,
    take: page_size,
    where: {
      ...(id && { id: Number(id) }),
      ...(assembly_id && {
        assembly_id: String(assembly_id),
      }),
    },
  });

  const data = await Promise.all(
    locuses.map(async (element) => {
      const locus_members = await prisma.rnc_locus_members.findMany({
        where: {
          locus: element,
          ...(region_id && { region_id: Number(region_id) }),
          ...(membership_status && {
            membership_status: String(membership_status),
          }),
        },
      });

      return {
        ...element,
        id: element.id.toString(),
        locus_members: locus_members.map((e) => ({
          ...e,
          locus_id: e.locus_id.toString(),
          id: e.id.toString(),
        })),
      };
    }),
  );

  if (locuses.length === 0) return res.status(404).send();

  return res.status(200).send(data);
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}.`);
});
