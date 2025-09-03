import Handlebars from 'handlebars';

export function renderTemplate(templateSource: string, context: Record<string, any>) {
  const template = Handlebars.compile(templateSource, { noEscape: false });
  return template(context);
}