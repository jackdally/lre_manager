import React, { useMemo } from 'react';

const DocsPage: React.FC = () => {
    const docsUrl = useMemo(() => {
        const envUrl = process.env.REACT_APP_DOCS_URL || 'http://localhost:3001/lre_manager/docs/intro';
        return envUrl;
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
            <div className="px-6 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
                <h1 className="text-xl font-semibold">Documentation</h1>
                <p className="text-sm text-gray-500">Embedded docs from Docusaurus</p>
            </div>
            <div style={{ flex: 1, width: '100%' }}>
                <iframe
                    title="LRE Manager Documentation"
                    src={docsUrl}
                    style={{ border: 'none', width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

export default DocsPage;


