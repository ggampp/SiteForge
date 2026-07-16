# Critérios de aceite por épico

## EPIC-0 Bootstrap

- [ ] `pnpm install && pnpm build` em repo limpo  
- [ ] CI falha se typecheck falhar  
- [ ] LICENSE presente  

## EPIC-1 Core Extract

- [ ] Dado HTML fixture local, `extract` produz JSON válido no schema Zod  
- [ ] Cada nó visível relevante tem ≥ estilos layout (display/position/box) quando aplicável  
- [ ] Screenshots PNG não vazios  
- [ ] `sourceId` reutilizável em comandos seguintes  
- [ ] URL inválida → erro `INVALID_URL` sem crash  

## EPIC-2 Chunking

- [ ] Validator `threePrinciples` passa no output default  
- [ ] Nenhuma pair de sections com overlap > threshold  
- [ ] União vertical cobre 0…pageHeight (com tolerância)  
- [ ] Nenhuma section acima de `maxTokens` (exceto flag force)  
- [ ] `sectionId`s estáveis se re-chunk mesma extraction (best-effort)  

## EPIC-3 Assets

- [ ] Imagens do fixture baixadas para targetDir  
- [ ] Falha de 1 URL não aborta batch  
- [ ] Manifest lista success/fail  
- [ ] Path escape fora de outDir rejeitado  

## EPIC-4 MCP

- [ ] Client MCP lista todas tools P0  
- [ ] `extract_page` + `list_sections` em sessão agent real  
- [ ] Respostas grandes truncadas com path para full  
- [ ] `doctor` reporta missing browsers claramente  

## EPIC-5 Skill

- [ ] Preflight detecta MCP SiteForge  
- [ ] Fases documentadas com nomes de tools  
- [ ] Spec template completo  
- [ ] Responsible use section presente  
- [ ] Sync gera pelo menos 3 hosts sem erro  

## EPIC-6 Template

- [ ] `npm run build` no template virgin  
- [ ] Placeholder instrui `/siteforge`  
- [ ] Pastas research/design-references existem  

## EPIC-7 QA

- [ ] visual_diff em duas imagens idênticas → score ~1 ou diff vazio  
- [ ] Imagens diferentes → score < threshold e diff file  
- [ ] Case study com screenshots before/after  

## EPIC-8 Hardening

- [ ] Path traversal tests  
- [ ] Timeout extract respeitado  
- [ ] Windows job green ou documentado known issue  

## Definição de “clone MVP bem-sucedido”

Para uma landing estática escolhida:

1. Extract + ≥ 3 sections  
2. Assets principais locais  
3. ≥ 50% das seções implementadas como componentes  
4. Build green  
5. Diff visual desktop documentado (mesmo que score médio)  
6. Gaps listados (animações, etc.)  
