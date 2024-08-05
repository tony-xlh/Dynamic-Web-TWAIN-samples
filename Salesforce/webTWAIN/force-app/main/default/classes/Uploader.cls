public with sharing class Uploader {
  @AuraEnabled(cacheable=true)
  public static Id uploadFile(Id parentId, String fileName, String base64Data) {
    Blob fileBlob = EncodingUtil.base64Decode(base64Data);

    ContentVersion contentVersion = new ContentVersion();
    contentVersion.ContentLocation = 'S';
    contentVersion.PathOnClient = fileName;
    contentVersion.Title = fileName;
    contentVersion.VersionData = fileBlob;

    insert contentVersion;

    ContentDocumentLink contentLink = new ContentDocumentLink();
    contentLink.ContentDocumentId = [SELECT Id FROM ContentDocument WHERE Id = :contentVersion.ContentDocumentId].Id;
    contentLink.LinkedEntityId = parentId;
    contentLink.ShareType = 'V';

    insert contentLink;

    return contentLink.Id;
  }
}