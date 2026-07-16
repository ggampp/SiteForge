# Architecture Decision Records (iniciais)

## ADR-001: Nome SiteForge

- **Status:** Accepted  
- **Context:** Precisávamos de marca distinta de WebClone/JCodesMore/PWC  
- **Decision:** SiteForge  
- **Consequences:** Verificar npm/GitHub; tagline Extract. Spec. Rebuild  

## ADR-002: MCP + Skill, não produto UI no MVP

- **Status:** Accepted  
- **Context:** PWC monólito é caro; gap de mercado é tools portáteis  
- **Decision:** T1/T2 sem Web UI / sandbox  
- **Consequences:** Host agent é o orchestrator  

## ADR-003: TypeScript monorepo

- **Status:** Accepted (recommended)  
- **Context:** Template Next + MCP SDK + um só language  
- **Decision:** pnpm + packages core/mcp/cli/skill  
- **Consequences:** Não portar PWC Python verbatim; reimplementar padrões  

## ADR-004: Reimplementar padrões, não fork PWC

- **Status:** Accepted  
- **Context:** PWC é MIT-alegado mas monólito; license SPDX null; acoplamento UI  
- **Decision:** Clean-room architecture inspired by PWC + JCodesMore  
- **Consequences:** Mais esforço inicial; menos dívida  

## ADR-005: Three principles chunking

- **Status:** Accepted  
- **Context:** Context window e qualidade de builders  
- **Decision:** Implementar no core como PWC/skill  
- **Consequences:** Parâmetro maxTokens configurável  

## ADR-006: Spec markdown + section JSON

- **Status:** Accepted  
- **Context:** JCodesMore usa MD; PWC usa JSON  
- **Decision:** JSON canônico no store; MD gerado/escrito pela skill  
- **Consequences:** Dois artefatos, um source of truth estruturado (JSON)  

## ADR-007: Ética first-class

- **Status:** Accepted  
- **Context:** Topic website-clone mistura phishing tools  
- **Decision:** Disclaimers em README, skill, docs  
- **Consequences:** Messaging explícito de uso autorizado  
