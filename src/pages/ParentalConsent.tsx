import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

const ParentalConsent = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 font-geist">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-8 py-6 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Parental Consent</h1>
                        <p className="text-sm text-slate-500">Prism Platform</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-black">

                    <h2 className="text-2xl font-bold mb-6">PARENTAL CONSENT</h2>

                    <div className="space-y-8">
                        <div className="border-b border-slate-200 pb-8">
                            <h3 className="text-lg font-semibold mb-4">Option 1: If a parent is registering on behalf of a child</h3>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 border-2 border-slate-400 rounded mt-0.5 flex-shrink-0"></div>
                                <p className="text-slate-700">
                                    I confirm that I am the child’s legal representative (parent or guardian) and give full consent to the collection and processing of the child’s data within the Prism platform. I have reviewed and accept the Terms of Use, Privacy Policy, and Ethical Guidelines.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Option 2: If a student is registering directly</h3>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 border-2 border-slate-400 rounded mt-0.5 flex-shrink-0"></div>
                                <p className="text-slate-700">
                                    I confirm that I have received permission from my parents or legal guardians to use the Prism platform. I accept the Terms of Use and understand that my data is protected by the platform’s anonymity principles.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 py-8">
                <div className="max-w-4xl mx-auto px-8 text-center text-slate-400 text-sm">
                    © 2026 Prism. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default ParentalConsent;
