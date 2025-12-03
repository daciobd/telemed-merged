import DrAIInterface from "./DrAIInterface";

export default function DrAIPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden" style={{ height: '700px' }}>
        <DrAIInterface />
      </div>
    </div>
  );
}
