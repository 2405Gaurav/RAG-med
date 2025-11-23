import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Types
interface SubQuery {
  query: string;
  type: string;
}

interface KnowledgeGraphEntity {
  entity: any;
  relationships: any[];
}

// Main POST handler (framework-agnostic)
export async function POST(request: Request): Promise<Response> {
  try {
    const { subQueries } = await request.json();

    if (!subQueries || !Array.isArray(subQueries)) {
      return new Response(
        JSON.stringify({ error: 'Valid subQueries array is required' }),
        { status: 400 }
      );
    }

    const results: any[] = [];

    for (const subQuery of subQueries) {
      const entities = await searchKnowledgeGraph(subQuery.query, subQuery.type);

      results.push({
        subQuery: subQuery.query,
        type: subQuery.type,
        entities: entities,
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('KG navigation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to navigate knowledge graph',
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

// -----------------------------------------------------
// Knowledge Graph Search Logic
// -----------------------------------------------------

async function searchKnowledgeGraph(query: string, queryType: string) {
  try {
    const keywords = extractKeywords(query);
    const found: KnowledgeGraphEntity[] = [];

    for (const keyword of keywords) {
      const { data: entities, error } = await supabase
        .from('knowledge_graph_entities')
        .select('*')
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .limit(5);

      if (error) {
        console.error('Entity search error:', error);
        continue;
      }

      if (entities && entities.length > 0) {
        for (const entity of entities) {
          const { data: relationships, error: relError } = await supabase
            .from('knowledge_graph_relationships')
            .select(`
              *,
              from_entity:knowledge_graph_entities!knowledge_graph_relationships_from_entity_id_fkey(*),
              to_entity:knowledge_graph_entities!knowledge_graph_relationships_to_entity_id_fkey(*)
            `)
            .or(`from_entity_id.eq.${entity.id},to_entity_id.eq.${entity.id}`)
            .limit(10);

          if (relError) console.error("Relationship fetch error:", relError);

          found.push({
            entity: entity,
            relationships: relationships || [],
          });
        }
      }
    }

    const unique = deduplicateEntities(found);
    return filterByQueryType(unique, queryType);

  } catch (error) {
    console.error('KG search error:', error);
    return [];
  }
}

function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    'what','is','are','the','a','an','how','do','does','can','could',
    'should','would','will','be','been','being','have','has','had',
    'of','for','to','in','on','at','by','with','from','about',
    'i','you','we','they','it','this','that','these','those'
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  return [...new Set(words)];
}

function deduplicateEntities(entities: KnowledgeGraphEntity[]) {
  const seen = new Set();
  const unique: KnowledgeGraphEntity[] = [];

  for (const item of entities) {
    if (!seen.has(item.entity.id)) {
      seen.add(item.entity.id);
      unique.push(item);
    }
  }

  return unique;
}

function filterByQueryType(entities: KnowledgeGraphEntity[], queryType: string) {
  const typeFilters: Record<string, string[]> = {
    symptoms: ['symptom', 'sign'],
    causes: ['cause', 'risk_factor'],
    treatment: ['treatment', 'drug', 'therapy'],
    prevention: ['prevention', 'lifestyle'],
    diagnosis: ['diagnosis', 'test'],
  };

  if (!queryType || queryType === 'general' || queryType === 'definition') {
    return entities.slice(0, 10);
  }

  const allowed = typeFilters[queryType] || [];

  const filtered = entities.filter(item =>
    allowed.includes(item.entity.entity_type) ||
    item.relationships.some(rel =>
      allowed.some(type => rel.relationship_type?.includes(type))
    )
  );

  if (filtered.length > 0) return filtered.slice(0, 10);

  return entities.slice(0, 5);
}
