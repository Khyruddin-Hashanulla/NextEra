import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  schemas: Record<string, unknown>[];
}

export function StructuredData({ schemas }: StructuredDataProps) {
  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
