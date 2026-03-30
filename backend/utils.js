function nanoid(size = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < size; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Specialty classifier — maps keywords to specialty
const SPECIALTY_MAP = {
  Cardiology: ['heart','cardiac','coronary','ecg','ekg','myocardial','atrial','ventricular','aorta','pericardium','endocardium','valve','arrhythmia','tachycardia','bradycardia','fibrillation','flutter','block','ischaemia','ischemia','angina','infarct','heart failure','cardiomyopathy','hypertension','blood pressure','stemi','nstemi','svt','af ','pvt','lbbb','rbbb','qt interval','pr interval','jvp','cardiac output','stroke volume','preload','afterload','ejection fraction','troponin','bnp','pericarditis','tamponade','endocarditis','stenosis','regurgitation','murmur','syncope','shock','raas','renin','angiotensin','aldosterone'],
  Respiratory: ['lung','pulmonary','respiratory','asthma','copd','pneumonia','pleura','pneumothorax','bronch','trachea','alveol','surfactant','hypoxia','hypercapnia','pco2','po2','spo2','fev1','fvc','spirometry','peak flow','inhaler','nebuliser','intubation','ventilation','ards','pulmonary embolism','dvt','sarcoidosis','fibrosis','tb','tuberculosis','haemoptysis','cough','wheeze','stridor','apnoea','sleep apnoea','oxygen','co2','v/q','dead space','shunt'],
  Nephrology: ['kidney','renal','nephro','glomerulo','tubule','nephron','creatinine','gfr','egfr','urea','bun','dialysis','aki','ckd','proteinuria','haematuria','cast','oliguria','anuria','polyuria','sodium','potassium','chloride','bicarbonate','acid-base','metabolic acidosis','metabolic alkalosis','respiratory acidosis','respiratory alkalosis','adh','vasopressin','aldosterone','diuretic','frusemide','furosemide','thiazide','spironolactone','nephrotic','nephritic','iga nephropathy','siadh'],
  Neurology: ['brain','neuron','nerve','neuro','stroke','tia','seizure','epilepsy','meningitis','encephalitis','dementia','alzheimer','parkinson','multiple sclerosis','mnd','motor neuron','cerebellum','brainstem','spinal cord','cortex','basal ganglia','thalamus','synapse','action potential','myelination','demyelination','nystagmus','ataxia','tremor','rigidity','spasticity','reflex','cranial nerve','gcs','headache','migraine','csf','lumbar puncture','mri brain','ct head','aphasia','dysarthria','dysphagia','consciousness','coma','gcs'],
  Endocrinology: ['diabetes','glucose','insulin','glucagon','hba1c','dka','dka','hhs','hypoglycaemia','thyroid','tsh','t3','t4','hypothyroid','hyperthyroid','graves','hashimoto','adrenal','cortisol','cushing','addison','acth','cortex','medulla','adrenaline','noradrenaline','epinephrine','pituitary','growth hormone','igf','prolactin','lh','fsh','gnrh','testosterone','oestrogen','progesterone','calcium','parathyroid','pth','vitamin d','bone','osteoporosis','hyperparathyroid','hypoparathyroid','metabolic syndrome','obesity','bmi','leptin','ghrelin','somatostatin','pancreas'],
  Haematology: ['blood','haemoglobin','haematocrit','rbc','wbc','platelet','coagulation','clotting','thrombosis','embolism','dvt','pe','anaemia','iron','ferritin','b12','folate','reticulocyte','haemolysis','sickle cell','thalassaemia','leukaemia','lymphoma','myeloma','bone marrow','stem cell','transfusion','warfarin','heparin','anticoagulant','antiplatelet','aspirin','clopidogrel','factor viii','haemophilia','thrombocytopenia','dic','prothrombin','inr','aptt'],
  Pharmacology: ['drug','mechanism','receptor','agonist','antagonist','inhibitor','enzyme','pharmacokinetics','pharmacodynamics','half-life','bioavailability','volume of distribution','first pass','cytochrome','cyp','p450','dose','toxicity','side effect','adverse','interaction','contraindication','beta blocker','ace inhibitor','arb','calcium channel','statin','antibiotic','antifungal','antiviral','nsaid','opioid','benzodiazepine','antidepressant','antipsychotic','diuretic','anticoagulant','vasopressor'],
  'Infectious Disease': ['infection','bacteria','virus','fungal','parasit','antibiotic','antimicrobial','sepsis','fever','culture','sensitivity','gram','pcr','serology','hiv','aids','malaria','typhoid','cholera','tuberculosis','meningococcal','pneumococcal','staphylococcus','streptococcus','e coli','klebsiella','pseudomonas','candida','aspergillus','plasmodium','leishmania','tropical','endemic','vaccine','immunity','innate','adaptive','antibody','immunoglobulin','complement','neutrophil','macrophage','lymphocyte'],
  GIT: ['gastro','intestin','bowel','colon','rectum','oesophag','esophag','stomach','duodenum','jejunum','ileum','liver','hepat','biliary','pancreas','gallbladder','bile','peptic ulcer','gerd','reflux','crohn','colitis','ibd','ibs','celiac','coeliac','appendix','hernia','obstruction','perforation','peritonitis','jaundice','cirrhosis','portal hypertension','ascites','varices','hepatitis','fatty liver','amylase','lipase','bilirubin','alt','ast','alp','ggt','endoscopy','colonoscopy'],
  Surgery: ['surgical','operation','incision','wound','suture','anastomosis','resection','excision','appendectomy','cholecystectomy','laparotomy','laparoscopy','hernia repair','trauma','fracture','dislocation','orthopaedic','bone','joint','ligament','tendon','amputation','abscess','debridement','wound healing','haemostasis','haemorrhage','shock','septic','anesthesia','anaesthesia','post-operative','complication','fistula','stoma'],
  Obstetrics: ['pregnancy','obstetric','antenatal','prenatal','trimester','fetal','foetal','labour','delivery','caesarean','placenta','umbilical','amniotic','preeclampsia','eclampsia','gestational diabetes','miscarriage','ectopic','postpartum','breastfeeding','neonatal','apgar','congenital','teratogen'],
  Paediatrics: ['paediatric','pediatric','child','infant','neonate','neonatal','growth','development','vaccination','immunisation','congenital','genetic','chromosomal','down syndrome','cystic fibrosis','failure to thrive','rickets','intussusception','pyloric stenosis','febrile convulsion','rsv','bronchiolitis','croup','kawasaki'],
  Immunology: ['autoimmune','immune','allergy','anaphylaxis','hypersensitivity','rheumatoid','lupus','sle','vasculitis','sjogren','scleroderma','inflammatory','cytokine','interleukin','tnf','antibody','antigen','mhc','hla','complement','immunosuppressant','steroid','methotrexate','biologics'],
  Psychiatry: ['mental','psychiatric','psychosis','schizophrenia','bipolar','depression','anxiety','ocd','ptsd','personality disorder','dementia','delirium','addiction','substance','alcohol','antidepressant','antipsychotic','mood stabiliser','lithium','ssri','snri','benzodiazepine','cognitive','behaviour','therapy','cbt','mse','suicide','self-harm'],
};

function classifySpecialty(text) {
  if (!text) return 'General';
  const lower = text.toLowerCase();
  const scores = {};
  for (const [specialty, keywords] of Object.entries(SPECIALTY_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length > 6 ? 3 : 1;
    }
    if (score > 0) scores[specialty] = score;
  }
  if (Object.keys(scores).length === 0) return 'General';
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

module.exports = { nanoid, classifySpecialty };
