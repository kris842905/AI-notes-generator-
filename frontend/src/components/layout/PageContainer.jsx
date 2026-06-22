import React from 'react';

const PageContainer = ({ children, title, subtitle }) => {
  return (
    <div className="flex-1 overflow-y-auto scroll-thin p-6 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {(title || subtitle) && (
          <div className="flex flex-col gap-1 border-b border-border pb-4 mb-2">
            {title && <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="animate-slide-up">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageContainer;
