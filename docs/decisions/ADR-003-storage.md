# ADR-003 — Storage de Imagens com MinIO / Cloudflare R2

**Data:** 2025  
**Status:** Aceito

## Contexto

Precisamos armazenar imagens de produtos de forma confiável, com URLs públicas para exibição no site.

## Decisão

Usar **MinIO em desenvolvimento** (self-hosted via Docker) e **Cloudflare R2 em produção**.

## Justificativa

- **Cloudflare R2:** zero custo de egresso (diferente do AWS S3, que cobra por GB baixado). Para um e-commerce com muitas visualizações de imagens, isso é crítico para o custo.
- **API S3-compatível:** MinIO e R2 têm a mesma API. O código não muda entre desenvolvimento e produção — só as variáveis de ambiente.
- **MinIO local:** sem custo, roda em Docker, idêntico à interface do S3/R2.
- **Simplicidade:** não precisamos de CDN separada — R2 já tem distribuição global via Cloudflare.

## Trade-offs aceitos

- Dependência da Cloudflare em produção — mitigável migrando para outro provider S3-compatible se necessário.
- MinIO adiciona um container no desenvolvimento — aceitável, já usamos Docker.

## Alternativas consideradas

- **AWS S3:** mais caro (egresso pago), mais complexo (IAM, regiões). Descartado.
- **Armazenar no servidor:** não escala, sem CDN, sem redundância. Descartado.
- **Cloudinary:** gratuito até certo ponto mas limitado, e adiciona dependência proprietária de transformação de imagens.
