# Hosting and domain options

_Comparison snapshot: 2026-08-18; `ayvbrg.dev`, `.dev` pricing, and the
recommendation rechecked 2026-08-19. GitHub Pages is intentionally excluded._

## Recommendation

Use **Cloudflare Pages Free** for hosting and **Porkbun** for the domain. Try
`ayvbrg.dev` first.

- Hosting is **$0/month**. Cloudflare includes 500 builds/month, 100 custom
  domains per project, and unlimited static requests and bandwidth. Its GitHub
  integration rebuilds on every push. [[Cloudflare limits](https://developers.cloudflare.com/pages/platform/limits/),
  [pricing](https://pages.cloudflare.com/),
  [GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)]
- `ayvbrg.dev` appears available: Google Registry's authoritative `.dev` RDAP
  endpoint returned `404 Not Found` with `ayvbrg.dev not found` when checked.
  This is a point-in-time indication, not a reservation; confirm the name is
  non-premium and still available at checkout.
  [[IANA RDAP bootstrap](https://data.iana.org/rdap/dns.json),
  [Google Registry RDAP result](https://pubapi.registry.google/rdap/domain/ayvbrg.dev)]
- Porkbun's live public pricing API lists `.dev` at **$8.75 for the first year,
  then $12.87/year** at the time of research. Hosting plus domain is therefore
  **$8.75 in year one and $12.87/year thereafter**, before taxes and future
  registry price changes.
  [[Porkbun pricing API](https://api.porkbun.com/api/json/v3/pricing/get),
  [Porkbun `.dev` pricing](https://porkbun.com/tld/dev)]
- Keep the generated site as ordinary HTML/CSS/JS and keep the domain separate
  from the host. Moving later then means deploying the same output elsewhere
  and changing DNS, rather than rewriting the site.

Cloudflare Registrar is the absolute-cost alternative: it charges registry and
ICANN cost with no markup, includes WHOIS redaction and DNSSEC, and advertises
registrations starting at $7.85. Its exact price for a particular available
name is shown during search/checkout, and a registered domain must keep
Cloudflare nameservers. That coupling is why Porkbun is the more portable
default despite Cloudflare Registrar potentially being slightly cheaper.
[[Cloudflare Registrar](https://www.cloudflare.com/products/registrar/),
[Cloudflare nameserver restriction](https://developers.cloudflare.com/registrar/get-started/register-domain/),
[changing nameservers at Porkbun](https://kb.porkbun.com/article/22-how-to-change-nameservers)]

## Host comparison

The lock-in column assumes a genuinely static build. Adding a provider's
functions, image pipeline, forms, edge middleware, or framework runtime raises
lock-in substantially.

| Host | Free-tier limits relevant here | Custom domain and GitHub push | Lock-in / catch |
| --- | --- | --- | --- |
| **Cloudflare Pages** | $0; 500 builds/month, one concurrent build, 20-minute build timeout; 20,000 files, 25 MiB per file; 100 custom domains/project; unlimited static requests and bandwidth. [[limits](https://developers.cloudflare.com/pages/platform/limits/), [static request pricing](https://developers.cloudflare.com/pages/functions/pricing/)] | Yes; the GitHub app builds and deploys every pushed branch, with PR previews. [[GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)] | Low for plain files. Moderate DNS coupling at the apex: a Pages apex domain must be a Cloudflare zone using Cloudflare nameservers; a subdomain can use a CNAME from another DNS provider. [[custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)] |
| **Netlify** | $0 with a hard **300-credit/month shared pool**. Production deploys cost 15 credits, bandwidth 20 credits/GB, and web requests 2 credits/10,000; thus 20 production deploys alone would consume the pool before any traffic. When the limit is reached, projects pause until the next cycle. [[pricing](https://www.netlify.com/pricing/), [credit plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)] | Yes; custom domains with SSL are included, and a linked GitHub repository rebuilds on push. [[credit-plan features](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [continuous deployment](https://docs.netlify.com/deploy/create-deploys/)] | Low for plain files, but `netlify.toml`, redirects, forms, functions, and the credit model are provider-specific. The small, multi-resource credit pool is a worse fit than Cloudflare's static allowance. |
| **Vercel Hobby** | $0 for **non-commercial personal use**; 100 GB/month fast data transfer, 1 million edge requests, 6,000 build-execution minutes, one concurrent build, 100 deployments/day, and 50 domains/project. [[Hobby plan](https://vercel.com/docs/plans/hobby), [limits](https://vercel.com/docs/limits), [CDN usage](https://vercel.com/docs/manage-cdn-usage)] | Yes; personal Git integration, automatic HTTPS and a preview deployment for every Git push are included. [[plans](https://vercel.com/docs/plans)] | Low for plain files; potentially high if the site adopts Vercel-specific or Next.js server features. Hobby's non-commercial restriction is the main catch for a personal site that may later earn money. |
| **Render Static Sites** | $0 Hobby; 5 GB/month outbound bandwidth, 500 build minutes/month, 2 custom domains, and up to 25 services. Extra bandwidth is $0.15/GB and extra domains are $0.25/month. [[current Hobby limits](https://render.com/docs/new-workspace-plans)] | Yes; connect GitHub, choose a branch, and Render rebuilds on every push. Custom domains and managed TLS are supported. [[static sites](https://render.com/docs/static-sites/)] | Low for plain files and operationally simple, but the current 5 GB allowance is much smaller than Cloudflare's or Vercel's. Worth naming as a straightforward fallback, not the best-value choice. |

For this small static site, Cloudflare wins without a close tradeoff: the free
tier removes bandwidth anxiety, its build quota is ample, and GitHub-to-preview
deployment is built in. Netlify's richer static-site workflow is unnecessary
here and now has a restrictive shared credit pool; Vercel is generous but
explicitly non-commercial on Hobby; Render is simple but bandwidth-limited.

## Domain options

`yvbrg.log` cannot be registered because `.log` is not a delegated top-level
domain: IANA's authoritative Root Zone Database has no `.log` entry (it moves
from `.lol` to `.london`), while `.dev` is delegated.
[[IANA Root Zone Database](https://www.iana.org/domains/root/db)]

Current standard-name prices at Porkbun:

| Candidate | Current registration price | Current renewal price | Fit |
| --- | ---: | ---: | --- |
| **`ayvbrg.dev`** | $8.75 first-year sale | $12.87/year | Best match for a developer log; it appeared unregistered when checked, and `.dev` requires HTTPS, which every shortlisted host supplies. [[availability](https://pubapi.registry.google/rdap/domain/ayvbrg.dev), [price](https://api.porkbun.com/api/json/v3/pricing/get)] |
| `ayvbrg.com` | $11.08 | $11.08/year | Most familiar and slightly cheaper recurring alternative if available. [[price](https://porkbun.com/tld/com)] |
| `ayvbrg.net` | $12.52 | $12.52/year | Recognizable neutral fallback, but less semantically apt than `.dev`. [[price](https://porkbun.com/tld/net)] |
| `ayvbrg.me` | $17.27 | $17.27/year | Clearly personal, but costs more. [[price](https://porkbun.com/tld/me)] |
| `ayvbrg.in` | $7.83 | $7.83/year | Cheapest relevant geographic option, with strict verifiable-contact requirements and no Porkbun WHOIS privacy. [[price and requirements](https://porkbun.com/tld/in), [privacy exclusions](https://porkbun.com/products/whois_privacy)] |

Prices can change, promotions may end, and a short name can be registered
between research and purchase. Confirm availability, non-premium status, taxes,
and the renewal total at checkout. Prefer the best durable name over a one-year
promotion: **buy `ayvbrg.dev` if available; otherwise check `ayvbrg.com`, then
`ayvbrg.net`**.

## Decision

**Cloudflare Pages Free + Porkbun + `ayvbrg.dev`**: $8.75 in year one and
$12.87/year after that at today's prices, with no hosting charge. Revisit the
host only if the site becomes commercial/dynamic, needs provider-specific
server functions, or exceeds Cloudflare's build/file limits.
