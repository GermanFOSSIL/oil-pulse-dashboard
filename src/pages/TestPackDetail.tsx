
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestPacks } from "@/hooks/useTestPacks";
import { 
  Edit, 
  Plus
} from "lucide-react";
import TagFormModal from "@/components/testpack/TagFormModal";
import TestPackFormModal from "@/components/testpack/TestPackFormModal";
import TestPackHeader from "@/components/testpack/TestPackHeader";
import TestPackContent from "@/components/testpack/TestPackContent";
import TestPackLoading from "@/components/testpack/TestPackLoading";

const TestPackDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    currentTestPack, 
    loading, 
    fetchTestPackWithTags, 
    updateTestPack 
  } = useTestPacks();
  
  const [isTagFormModalOpen, setIsTagFormModalOpen] = useState(false);
  const [isTestPackFormModalOpen, setIsTestPackFormModalOpen] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchTestPackWithTags(id);
    }
  }, [id, fetchTestPackWithTags]);
  
  const handleRefresh = () => {
    if (id) {
      fetchTestPackWithTags(id);
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleExportExcel = () => {
    // Functionality to be implemented later
    console.log("Export to Excel");
  };
  
  if (loading && !currentTestPack) {
    return <TestPackLoading onBack={handleBack} />;
  }
  
  if (!currentTestPack) {
    return <TestPackLoading isNotFound onBack={handleBack} />;
  }
  
  return (
    <div className="space-y-6">
      <TestPackHeader 
        testPackName={currentTestPack.nombre_paquete}
        itrAsociado={currentTestPack.itr_asociado}
        sistema={currentTestPack.sistema}
        subsistema={currentTestPack.subsistema}
        estado={currentTestPack.estado}
        onBack={handleBack}
        onRefresh={handleRefresh}
        onExportExcel={handleExportExcel}
        onAddTag={() => setIsTagFormModalOpen(true)}
        onEditTestPack={() => setIsTestPackFormModalOpen(true)}
      />
      
      <TestPackContent
        tags={currentTestPack.tags}
        testPackId={currentTestPack.id}
        onRefresh={handleRefresh}
      />
      
      <TagFormModal 
        isOpen={isTagFormModalOpen} 
        onClose={() => setIsTagFormModalOpen(false)} 
        onSuccess={() => {
          setIsTagFormModalOpen(false);
          handleRefresh();
        }}
        testPackId={currentTestPack.id}
      />
      
      <TestPackFormModal 
        isOpen={isTestPackFormModalOpen} 
        onClose={() => setIsTestPackFormModalOpen(false)} 
        onSuccess={() => {
          setIsTestPackFormModalOpen(false);
          handleRefresh();
        }}
        testPack={currentTestPack}
      />
    </div>
  );
};

export default TestPackDetail;
