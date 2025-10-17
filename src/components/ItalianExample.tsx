/**
 * Example Italian-Localized Component
 * Demonstrates how to use the Italian localization system
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useItalianLabels } from '../config/italian-labels';
import { ROUTES } from '../config/routes';
import { SEO_CONFIG } from '../config/seo';
import { PageMeta } from './PageMeta';

interface ItalianExampleProps {
  title?: string;
}

export const ItalianExample: React.FC<ItalianExampleProps> = ({ title = 'Esempio' }) => {
  const navigate = useNavigate();
  const { labels, t } = useItalianLabels();

  const handleNavigateToContacts = () => {
    navigate(ROUTES.contacts);
  };

  const handleNavigateToInsurance = () => {
    navigate(ROUTES.insurance.dashboard);
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <PageMeta
        title={title}
        description="Esempio di componente localizzato in italiano per Guardian AI CRM"
        keywords={['esempio', 'localizzazione', 'italiano', 'CRM']}
        url="/esempio"
      />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title} - {t('navigation.dashboard')}
          </h1>
          <p className="text-gray-600">
            {t('common.loading')} {labels.common.currency}1,234.56
          </p>
        </div>

        {/* Navigation Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Standard CRM Navigation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t('navigation.contacts')}</h2>
            <div className="space-y-3">
              <button
                onClick={handleNavigateToContacts}
                className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                📋 {t('contacts.contactList')}
              </button>
              <button className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                ➕ {t('contacts.newContact')}
              </button>
              <button className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                📈 {t('opportunities.title')}
              </button>
            </div>
          </div>

          {/* Insurance Navigation */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t('insurance.title')}</h2>
            <div className="space-y-3">
              <button
                onClick={handleNavigateToInsurance}
                className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
              >
                🏠 {t('insurance.dashboard')}
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-md transition-colors">
                📄 {t('insurance.policiesManagement')}
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-md transition-colors">
                🚗 {t('insurance.claimsManagement')}
              </button>
            </div>
          </div>
        </div>

        {/* Form Example */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('forms.newForm')}</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fields.firstName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('fields.firstName')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fields.lastName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('fields.lastName')}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fields.email')}
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('fields.email')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fields.status')}
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('common.selectOption')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="inactive">{t('status.inactive')}</option>
                <option value="pending">{t('status.pending')}</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('actions.save')}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                {t('actions.cancel')}
              </button>
            </div>
          </form>
        </div>

        {/* Status & Priority Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t('fields.status')}</h3>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {t('status.active')}
              </span>
              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {t('status.pending')}
              </span>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {t('status.inactive')}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t('fields.priority')}</h3>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {t('priority.urgent')}
              </span>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                {t('priority.high')}
              </span>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {t('priority.medium')}
              </span>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {t('priority.low')}
              </span>
            </div>
          </div>
        </div>

        {/* SEO Information */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📈 SEO Configuration</h4>
          <p className="text-blue-800 text-sm">
            <strong>Italian URLs:</strong> {ROUTES.contacts}, {ROUTES.opportunities}, {ROUTES.insurance.policies}
          </p>
          <p className="text-blue-800 text-sm">
            <strong>Meta Title Template:</strong> {SEO_CONFIG.site.titleTemplate}
          </p>
          <p className="text-blue-800 text-sm">
            <strong>Locale:</strong> {SEO_CONFIG.site.locale}
          </p>
        </div>
      </div>
    </>
  );
};