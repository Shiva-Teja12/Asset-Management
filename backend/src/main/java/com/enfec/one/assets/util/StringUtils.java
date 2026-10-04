package com.enfec.one.assets.util;
public final class StringUtils {
 private StringUtils(){}
 public static String blankToNull(String s){return s==null||s.isBlank()?null:s.trim();}
}
